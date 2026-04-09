plugins {
    id("org.springframework.boot") version "3.2.0" apply false
    id("io.spring.dependency-management") version "1.1.4" apply false
    id("org.jetbrains.kotlin.jvm") version "1.9.21" apply false
    id("org.jetbrains.kotlin.plugin.spring") version "1.9.21" apply false
    id("org.jlleitschuh.gradle.ktlint") version "12.1.0" apply false
    id("java")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
allprojects {
    group = "com.example.drink-water"
    version = "1.0.0"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")
    apply(plugin = "org.jetbrains.kotlin.plugin.spring")
    apply(plugin = "java")
    apply(plugin = "org.springframework.boot")
    apply(plugin = "io.spring.dependency-management")
    apply(plugin = "org.jlleitschuh.gradle.ktlint")

    configure<JavaPluginExtension> {
        toolchain {
            languageVersion = JavaLanguageVersion.of(21)
        }
    }

    the<io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension>().imports {
        mavenBom("org.springframework.cloud:spring-cloud-dependencies:2023.0.0")
    }

    configure<org.jlleitschuh.gradle.ktlint.KtlintExtension> {
        version.set("1.2.1")
        verbose.set(true)
        outputToConsole.set(true)
        coloredOutput.set(true)
        filter {
            exclude("**/generated/**")
            include("**/kotlin/**")
        }
    }

    dependencies {
        add("implementation", "org.springframework.boot:spring-boot-starter-web")
        add("implementation", "org.springframework.boot:spring-boot-starter-data-jpa")
        add("implementation", "org.springframework.boot:spring-boot-starter-validation")
        add("implementation", "org.springframework.boot:spring-boot-starter-actuator")
        add("implementation", "org.springframework.kafka:spring-kafka")
        add("implementation", "org.springframework.cloud:spring-cloud-starter-openfeign")
        add("implementation", "org.jetbrains.kotlin:kotlin-reflect")
        add("implementation", "org.jetbrains.kotlin:kotlin-stdlib-jdk8")
        add("runtimeOnly", "com.h2database:h2")
        add("compileOnly", "org.projectlombok:lombok:1.18.38")
        add("annotationProcessor", "org.projectlombok:lombok:1.18.38")
        add("testImplementation", "org.springframework.boot:spring-boot-starter-test")
        add("testRuntimeOnly", "org.junit.platform:junit-platform-launcher")
    }

    tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
        kotlinOptions {
            freeCompilerArgs += "-Xjsr305=strict"
            jvmTarget = "21"
        }
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }
}

project(":device-service") {
    dependencies {
        add("implementation", project(":shared"))
    }
}

project(":push-service") {
    dependencies {
        add("implementation", project(":shared"))
        add("implementation", "io.github.openfeign:feign-okhttp:13.1")
        add("implementation", "com.squareup.okhttp3:okhttp:4.12.0")
        add("implementation", "com.auth0:java-jwt:4.4.0")
    }
}

project(":water-service") {
    dependencies {
        add("implementation", project(":shared"))
        add("implementation", "org.springframework.cloud:spring-cloud-starter-openfeign")
    }
}
